class Story < ActiveRecord::Base

  include FriendlyId

  belongs_to :success

  # Note: no explicit association to friendly_id_slugs, but it's there
  # Story has many friendly_id_slugs -> captures history of slug changes

  # Story title should be unique, even across companies
  # This because friendly_id allows us to search based on the title slug
  validates :title, presence: true, uniqueness: true

  friendly_id :title, use: [:slugged, :finders, :history]

  # scrub user-supplied html input using whitelist
  before_save :scrub_html_input, on: [:create, :update],
              if: Proc.new { self.content.present? && self.content_changed? }

  scope :company_all, ->(company_id) {
    joins(success: { customer: {} })
    .where(customers: { company_id: company_id })
  }
  scope :company_all_filter_category, ->(company_id, category_id) {
    joins(success: { customer: {}, story_categories: {} })
    .where(customers: { company_id: company_id },
           story_categories: { id: category_id } )
  }
  scope :company_all_filter_product, ->(company_id, product_id) {
    joins(success: { customer: {}, products: {} })
    .where(customers: { company_id: company_id },
           products: { id: product_id } )
  }
  scope :company_public, ->(company_id) {
    joins(success: { customer: {} })
    .where(logo_published: true,
           customers: { company_id: company_id })
  }
  scope :company_public_filter_category, ->(company_id, category_id) {
    joins(success: { customer: {}, story_categories: {} })
    .where(logo_published: true,
           customers: { company_id: company_id },
           story_categories: { id: category_id })
  }
  scope :company_public_filter_product, ->(company_id, product_id) {
    joins(success: { customer: {}, products: {} })
    .where(logo_published: true,
           customers: { company_id: company_id },
           products: { id: product_id })
  }

  # method takes an active record relation
  def self.order stories_relation
    stories_relation
      .order("stories.published DESC, stories.publish_date ASC")
      .order("stories.updated_at DESC")
  end

  def should_generate_new_friendly_id?
    new_record? || title_changed? || slug.blank?
  end

  def scrub_html_input
    white_list_sanitizer = Rails::Html::WhiteListSanitizer.new
    self.content = white_list_sanitizer.sanitize(content, tags: %w(a p span strong i u blockquote pre font h1 h2 h3 h4 h5 h6 table tr td ol ul li hr img), attributes: %w(id class style face href src))
  end

  def assign_tags new_story
    if new_story[:category_tags]
      new_story[:category_tags].each do |selection|
        if selection.to_i == 0   # if it's a generic tag
          # create a new company category category based on the generic tag
          self.success.story_categories << StoryCategory.create(
              name: selection, company_id: current_user.company.id)
        else  # selection is the id of an existing company story category
          self.success.story_categories << StoryCategory.find(selection)
        end
      end
    end
    if new_story[:product_tags]
      new_story[:product_tags].each do |selection|
        self.success.products << Product.find(selection)
      end
    end
  end

  def update_tags new_tags
    old_category_tags = self.success.story_categories
    old_product_tags = self.success.products
    # remove deleted category tags ...
    old_category_tags.each do |category|
      unless (new_tags.try(:[], :category_tags)) &&
          (new_tags.try(:[], :category_tags).include? category.id.to_s)
        StoryCategoriesSuccess.where("success_id = ? AND story_category_id = ?",
                                self.success.id, category.id)[0].destroy
      end
    end
    # add new category tags ...
    unless new_tags.try(:[], :category_tags).nil?
      new_tags[:category_tags].each do |category_id|
        unless old_category_tags.any? { |category| category.id == category_id.to_i }
          self.success.story_categories << StoryCategory.find(category_id.to_i)
        end
      end
    end

    # remove deleted product tags ...
    old_product_tags.each do |product|
      unless (new_tags.try(:[], :product_tags)) &&
          (new_tags.try(:[], :product_tags).include? product.id.to_s)
        ProductsSuccess.where("success_id = ? AND product_id = ?",
                                  self.success.id, product.id)[0].destroy
      end
    end

    # add new product tags ...
    unless new_tags.try(:[], :product_tags).nil?
      new_tags[:product_tags].each do |product_id|
        unless old_product_tags.any? { |product| product.id == product_id.to_i }
          self.success.products << Product.find(product_id.to_i)
        end
      end
    end
  end

  # method returns a friendly id path that either contains or omits a product
  def csp_story_path
    url_helpers = Rails.application.routes.url_helpers
    success = self.success
    if success.products.present?
      url_helpers.public_story_path(success.customer.slug,
                                    success.products.take.slug,
                                    self.slug)
    else
      url_helpers.public_story_no_product_path(success.customer.slug,
                                               self.slug)
    end
  end

  # method returns a friendly id url that either contains or omits a product
  def csp_story_url
    url_helpers = Rails.application.routes.url_helpers
    success = self.success
    company = success.customer.company
    if success.products.present?
      url_helpers.public_story_url(
                    success.customer.slug,
                    success.products.take.slug,
                    self.slug,
                    subdomain: company.subdomain )
    else
      url_helpers.public_story_no_product_url(
                    success.customer.slug,
                    self.slug,
                    subdomain: company.subdomain )
    end
  end

  # defining this method makes it easy to include the edit_story_path helper
  # with activity feed response (contributions_submitted and contribution_requests_received)
  def csp_edit_story_path
    url_helpers = Rails.application.routes.url_helpers
    url_helpers.edit_story_path(self.id)
  end

  ##
  #  embed_url looks like one of these ...
  #
  #  "https://www.youtube.com/embed/#{youtube_id}"
  #  "https://player.vimeo.com/video/#{vimeo_id}"
  #  "https://fast.wistia.com/embed/medias/#{wistia_id}.jsonp"
  #
  def video_info
    return { provider: nil, id: nil } if self.embed_url.blank?
    if self.embed_url.include? "youtube"
      { provider: 'youtube',
        id: embed_url.slice(embed_url.rindex('/') + 1, embed_url.length) }
    elsif self.embed_url.include? "vimeo"
      { provider: 'vimeo',
        id: embed_url.slice(embed_url.rindex('/') + 1, embed_url.length) }
    elsif self.embed_url.include? "wistia"
      { provider: 'wistia',
        id: self.embed_url.match(/\/(?<id>\w+)(\.\w+$)/)[:id] }
    else
      # error
    end
  end

  def contributions_pre_request
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where(status: 'pre_request')
      .order(created_at: :desc)  # most recent first
  end

  # sort oldest to newest (according to status)
  def contributions_in_progress
    status_options = ['opt_out', 'unsubscribe', 'remind2', 'remind1', 'request', 're_send']
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where('status IN (?)', status_options)
      .sort do |a,b|  # sorts as per order of status_options
        if status_options.index(a.status) < status_options.index(b.status)
          -1
        elsif status_options.index(a.status) > status_options.index(b.status)
          1
        else 0
        end
      end
  end

  def contributions_next_steps
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where('status IN (?)', ['feedback', 'did_not_respond'])
      .order("CASE status
                WHEN 'feedback' THEN '1'
                WHEN 'did_not_respond' THEN '2'
              END")
  end

  def contributions_submitted
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where(status: 'contribution')
      .order(submitted_at: :desc)
  end

  def contributions_as_connections
    Contribution
      .story_all_except_curator(self.id, self.success.curator.id)
      .includes(:contributor, :referrer)
      .where.not("status IN ('unsubscribe', 'opt_out')")
      .order("CASE role
                WHEN 'customer' THEN '1'
                WHEN 'partner' THEN '2'
                WHEN 'sales' THEN '3'
              END")
  end

  # this method closely resembles the 'set_contributors' method in stories controller;
  # adds contributor linkedin data, which is necessary client-side for widgets
  # that fail to load
  def published_contributors
    curator = self.success.curator
    contributors =
      User.joins(own_contributions: { success: {} })
          .where.not(linkedin_url:'')
          .where(successes: { id: self.success_id },
                 contributions: { publish_contributor: true })
          .order("CASE contributions.role
                    WHEN 'customer' THEN '1'
                    WHEN 'partner' THEN '2'
                    WHEN 'sales' THEN '3'
                  END")
          .map do |contributor|
             { widget_loaded: false,
               id: contributor.id,
               first_name: contributor.first_name,
               last_name: contributor.last_name,
               linkedin_url: contributor.linkedin_url,
               linkedin_photo_url: contributor.linkedin_photo_url,
               linkedin_title: contributor.linkedin_title,
               linkedin_company: contributor.linkedin_company,
               linkedin_location: contributor.linkedin_location }
           end
    contributors.delete_if { |c| c[:id] == curator.id }
    # don't need the id anymore, don't want to send it to client ...
    contributors.map! { |c| c.except(:id) }
    if curator.linkedin_url.present?
      contributors.push({ widget_loaded: false }
                  .merge(self.success.curator.slice(
                    :first_name, :last_name, :linkedin_url, :linkedin_photo_url,
                    :linkedin_title, :linkedin_company, :linkedin_location )))
    end
    contributors
  end

  # not currently used, maybe include with json api
  def published_tags
    return nil unless self.published?
    { categories: self.success.story_categories.map { |c| { name: c.name, slug: c.slug } },
      products: self.success.products.map { |p| { name: p.name, slug: p.slug } }}
  end

  # not currently used, maybe include with json api
  def published_content
    return nil unless self.published?
    { title: title,
      quote: quote,
      quote_attr: quote_attr,
      content: content }
  end

end
