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

  def should_generate_new_friendly_id?
    new_record? || title_changed? || slug.blank?
  end

  def scrub_html_input
    white_list_sanitizer = Rails::Html::WhiteListSanitizer.new
    self.content = white_list_sanitizer.sanitize(content, tags: %w(a p strong i u blockquote pre font h1 h2 h3 h4 h5 h6 table tr td ol ul li hr img), attributes: %w(id class style face href src))
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
  def csp_story_path pdf=false
    format = pdf ? :pdf : ''
    url_helpers = Rails.application.routes.url_helpers
    if self.success.products.present?
      url_helpers.public_story_path(self.success.customer.slug,
                                    self.success.products.take.slug,
                                    self.slug,
                                    format: format)
    else
      url_helpers.public_story_no_product_path(self.success.customer.slug,
                                               self.slug,
                                               format: format)
    end
  end

end
