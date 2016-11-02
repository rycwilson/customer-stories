class Company < ActiveRecord::Base

  before_validation :smart_add_url_protocol

  validates :name, presence: true, uniqueness: true
  validates :subdomain, presence: true, uniqueness: true
  validates :website, presence: true, uniqueness: true, website: true
  validates_length_of :subdomain, maximum: 32, message: "must be 32 characters or less"
  validates_format_of :subdomain, with: /\A[a-z0-9-]*\z/, on: [:create, :update], message: "may only contain lowercase alphanumerics or hyphens"
  validates_exclusion_of :subdomain, in: ['www', 'mail', 'ftp'], message: "is not available"

  has_many :users  # no dependent: :destroy users, handle more gracefully
  has_many :invited_curators, dependent: :destroy

  has_many :customers, dependent: :destroy
  has_many :successes, through: :customers
  has_many :stories, through: :successes
  has_many :visitors, dependent: :destroy

  has_many :story_categories, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :product_categories, dependent: :destroy

  has_many :email_templates, dependent: :destroy

  # presently uploading direct to S3, paperclip not used
  # paperclip
  has_attached_file :logo, styles: { medium: "300x300>", thumb: "100x100>" }, default_url: "companies/:style/missing_logo.png"
  validates_attachment_content_type :logo, content_type: /\Aimage\/.*\Z/

  after_commit :invalidate_cache_keys, on: :update,
    if: Proc.new { |company|
      (company.previous_changes.keys & ['nav_color_1', 'nav_text_color']).any?
    }

  # why did this crap out when seeding?
  # CSP = self.find_by(name:'CSP')

  def all_stories
    # Rails.cache.fetch("#{self.subdomain}/all_stories", expires_in: 24.hours) do
      Story.order(Story.company_all(self.id)).pluck(:id)
    # end
  end

  def all_stories_filter_category category_id
    # Rails.cache.fetch("#{self.subdomain}/all_stories_category_#{category_id}",
                      # expires_in: 24.hours) do
      Story.order(Story.company_all_filter_category(self.id, category_id)).pluck(:id)
    # end
  end

  def all_stories_filter_product product_id
    # Rails.cache.fetch("#{self.subdomain}/all_stories_product_#{product_id}",
                      # expires_in: 24.hours) do
      Story.order(Story.company_all_filter_product(self.id, product_id)).pluck(:id)
    # end
  end

  def public_stories
    # Rails.cache.fetch("#{self.subdomain}/public_stories",
    #                   expires_in: 24.hours) do
      Story.order(Story.company_public(self.id)).pluck(:id)
    # end
  end

  def public_stories_filter_category category_id
    # Rails.cache.fetch("#{self.subdomain}/public_stories_category_#{category_id}",
    #                   expires_in: 24.hours) do
      Story.order(Story.company_public_filter_category(self.id, category_id)).pluck(:id)
    # end
  end

  def public_stories_filter_product product_id
    # Rails.cache.fetch("#{self.subdomain}/public_stories_product_#{product_id}",
    #                   expires_in: 24.hours) do
      Story.order(Story.company_public_filter_product(self.id, product_id)).pluck(:id)
    # end
  end

  # TODO: faster? http://stackoverflow.com/questions/20014292
  def filter_stories_by_tag filter_params, is_curator
    if filter_params[:id] == '0'  # all stories
      story_ids = is_curator ? story_ids = self.all_stories : self.public_stories
    else
      case filter_params[:tag]  # all || category || product
        when 'all'
          story_ids = is_curator ? self.all_stories : self.public_stories
        when 'category'
          # use the slug to look up the category id,
          # unless filter_params[:id] already represents the id
          category_id = (StoryCategory
                           .friendly
                           .find(filter_params[:id]) # will find whether id or slug
                           .id unless filter_params[:id].to_i != 0).try(:to_i) ||
                        filter_params[:id].to_i
          story_ids = is_curator ? self.all_stories_filter_category(category_id) :
                                   self.public_stories_filter_category(category_id)
        when 'product'
          # use the slug to look up the product id,
          # unless filter_params[:id] already represents the id
          product_id = (Product
                          .friendly
                          .find(filter_params[:id])
                          .id unless filter_params[:id].to_i != 0).try(:to_i) ||
                       filter_params[:id].to_i
          story_ids = is_curator ? self.all_stories_filter_product(product_id) :
                                   self.public_stories_filter_product(product_id)
        else
      end
    end
    Story.find(story_ids)
         .sort_by { |story| story_ids.index(story.id) }
  end

  # all_stories_json returns data included in the client via the gon object
  def all_stories_json
    JSON.parse(
      Story.order(Story.company_all(self.id))
      .to_json({
        only: [:id, :published, :logo_published, :publish_date, :updated_at],
        methods: [:csp_story_path, :published_contributors],
        include: {
          success: {
            only: [],
            include: {
              customer: { only: [:name, :logo_url] },
              story_categories: { only: [:id, :name, :slug] },
              products: { only: [:id, :name, :slug] } }}}
      })
    )
  end

  def curator? current_user=nil
    return false if current_user.nil?
    current_user.company_id == self.id
  end

  def create_email_templates
    self.email_templates.destroy_all
    # CSP.email_templates.each do |template|
    Company.find_by(name:'CSP').email_templates.each do |template|
      self.email_templates << template.dup
    end
  end

  def category_select_options
    self.story_categories
        .map do |category|
          [ category.name, category.id, { data: { slug: category.slug } } ]
        end.sort
  end

  # method returns an array of category tags for which
  # a logo-published story exists for the given company (self)
  def public_category_select_options
    StoryCategory.joins(successes: { story: {}, customer: {} })
                 .where(customers: { company_id: self.id },
                          stories: { logo_published: true })
                 .uniq
                 .map do |category|
                   [ category.name, category.id, { data: { slug: category.slug } } ]
                 end.sort.unshift ['All', 0]
  end

  def product_select_options
    self.products
        .map do |product|
          [ product.name, product.id, { data: { slug: product.slug } } ]
        end.sort
  end

  # method returns an array of product tags for which
  # a logo-published story exists for the given company
  def public_product_select_options
    Product.joins(successes: { story: {}, customer: {} })
           .where(customers: { company_id: self.id },
                    stories: { logo_published: true })
           .uniq
           .map do |product|
             [ product.name, product.id, { data: { slug: product.slug } } ]
           end
           .sort
           .unshift ['All', 0]
  end

  def customer_select_options
    self.customers.map do |customer|
      # name will appear as a selection, while its id will be the value submitted
      [ customer.name, customer.id, ]
    end
    .unshift( [""] )  # empty option makes placeholder possible (only needed for single select)
  end

  def templates_select
    self.email_templates.map do |template|
      [template.name, template.id]
    end
    .sort
    .unshift( [""] )
  end

  # slightly different than updating tags for a story
  def update_tags new_tags
    old_category_tags = self.story_categories
    old_product_tags = self.products
    # remove deleted category tags ...
    old_category_tags.each do |category_tag|
      if new_tags[:category].nil? || !(new_tags[:category].include? category_tag.id.to_s)
        # remove the tag from any successes
        StoryCategoriesSuccess.where(story_category_id: category_tag.id).destroy_all
        # destroy the tag
        category_tag.destroy
      end
    end
    # add new category tags ...
    new_tags[:category].each do |category_tag_id|
      if category_tag_id.to_i == 0 # new (custom or default) tag
        self.story_categories << StoryCategory.create(name: category_tag_id)
      else
        # do nothing
      end
    end unless new_tags[:category].nil?
    # remove deleted product tags ...
    old_product_tags.each do |product|
      if new_tags[:product].nil? || !(new_tags[:product].include? product.id.to_s)
        # remove the tag from any successes it appears in
        ProductsSuccess.where(product_id: product.id).destroy_all
        # destroy the tag
        product.destroy
      end
    end
    # add new product tags ...
    new_tags[:product].each do |product_id|
      if product_id.to_i == 0 # new tag
        self.products << Product.create(name: product_id)
      else
        # do nothing
      end
    end unless new_tags[:product].nil?
  end

  # this is used for validating the company's website address
  # see lib/website_validator.rb
  def smart_add_url_protocol
    unless self.website[/\Ahttp:\/\//] || self.website[/\Ahttps:\/\//]
      self.website = "http://#{self.website}"
    end
  end

  def header_style
    "background:linear-gradient(45deg, #{self.nav_color_1} 0%, #{self.nav_color_2} 100%);color:#{self.nav_text_color};"
  end

  def missing_info
    missing = []
    missing << "logo" unless self.logo_url.present?
    missing << "story_categories" unless self.story_categories.present?
    missing << "products" unless self.products.present?
    missing
  end

  def products_jsonld
    self.products.map do |product|
                    { "@type" => "Product",
                      "name" => product.name }
                  end
  end

  def latest_story_publish_date
    self.stories.where(published: true).order(:publish_date).take.try(:publish_date)
  end

  def latest_story_modified_date
    self.stories.where(logo_published: true).order(logo_publish_date: :desc).take.try(:logo_publish_date)
  end

  def invalidate_cache_keys
    self.successes.each do |success|
      success.story.invalidate_story_tile_cache_keys
    end
    self.increment_stories_index_memcache_iterator
  end

  def stories_index_memcache_iterator
    Rails.cache.fetch("#{self.subdomain}/stories-index-memcache-iterator") { rand(10) }
  end

  def increment_stories_index_memcache_iterator
    Rails.cache.write("#{self.subdomain}/stories-index-memcache-iterator", self.stories_index_memcache_iterator + 1)
  end

  def curator_category_select_memcache_iterator
    Rails.cache.fetch("#{self.subdomain}/curator-category-select-memcache-iterator") { rand(10) }
  end

  def increment_curator_category_select_memcache_iterator
    Rails.cache.write("#{self.subdomain}/curator-category-select-memcache-iterator", self.curator_category_select_memcache_iterator + 1)
  end

  def curator_product_select_memcache_iterator
    Rails.cache.fetch("#{self.subdomain}/curator-product-select-memcache-iterator") { rand(10) }
  end

  def increment_curator_product_select_memcache_iterator
    Rails.cache.write("#{self.subdomain}/curator-product-select-memcache-iterator", self.curator_product_select_memcache_iterator + 1)
  end

  def public_category_select_memcache_iterator
    Rails.cache.fetch("#{self.subdomain}/public-category-select-memcache-iterator") { rand(10) }
  end

  def increment_public_category_select_memcache_iterator
    Rails.cache.write("#{self.subdomain}/public-category-select-memcache-iterator", self.public_category_select_memcache_iterator + 1)
  end

  def public_product_select_memcache_iterator
    Rails.cache.fetch("#{self.subdomain}/public-product-select-memcache-iterator") { rand(10) }
  end

  def increment_public_product_select_memcache_iterator
    Rails.cache.write("#{self.subdomain}/public-product-select-memcache-iterator", self.public_product_select_memcache_iterator + 1)
  end

end
