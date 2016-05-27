class Story < ActiveRecord::Base

  include FriendlyId

  belongs_to :success
  # Note: no explicit association to friendly_id_slugs, but it's there
  # Story has many friendly_id_slugs -> captures history of slug changes

  # Story title should be unique, even across companies
  # This because friendly_id allows us to search based on the title slug
  validates :title, presence: true, uniqueness: true

  friendly_id :title, use: [:slugged, :finders, :history]

  def should_generate_new_friendly_id?
    new_record? || title_changed? || slug.blank?
  end

  def assign_tags new_story
    if new_story[:industry_tags]
      new_story[:industry_tags].each do |selection|
        if selection.to_i == 0   # if it's a generic tag
          # create a new company industry category based on the generic tag
          self.success.industry_categories << IndustryCategory.create(
              name: selection, company_id: current_user.company.id)
        else  # selection is the id of an existing company industry category
          self.success.industry_categories << IndustryCategory.find(selection)
        end
      end
    end
    if new_story[:product_cat_tags]
      new_story[:product_cat_tags].each do |selection|
        self.success.product_categories << ProductCategory.find(selection)
      end
    end
    if new_story[:product_tags]
      new_story[:product_tags].each do |selection|
        self.success.products << Product.find(selection)
      end
    end
  end

  def update_tags new_tags
    old_industry_tags = self.success.industry_categories
    old_product_cat_tags = self.success.product_categories
    old_product_tags = self.success.products
    # add new industry tags ...
    unless new_tags.try(:[], :industry_tags).nil?
      new_tags[:industry_tags].each do |industry_id|
        unless old_industry_tags.any? { |industry| industry.id == industry_id.to_i }
          self.success.industry_categories << IndustryCategory.find(industry_id.to_i)
        end
      end
    end
    # remove deleted industry tags ...
    old_industry_tags.each do |industry|
      unless (new_tags.try(:[], :industry_tags)) && (new_tags.try(:[], :industry_tags).include? industry.id.to_s)
        IndustriesSuccess.where("success_id = ? AND industry_category_id = ?",
                                  self.success.id, industry.id)[0].destroy
      end
    end
    # add new product category tags ...
    unless new_tags.try(:[], :product_category_tags).nil?
      new_tags[:product_category_tags].each do |product_cat_id|
        unless old_product_cat_tags.any? { |product_cat| product_cat.id == product_cat_id.to_i }
          self.success.product_categories << ProductCategory.find(product_cat_id.to_i)
        end
      end
    end
    # remove deleted product category tags ...
    old_product_cat_tags.each do |product_cat|
      unless (new_tags.try(:[], :product_category_tags)) &&
          (new_tags.try(:[], :product_category_tags).include? product_cat.id.to_s)
        ProductCatsSuccess.where("success_id = ? AND product_category_id = ?",
                                  self.success.id, product_cat.id)[0].destroy
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
    # remove deleted product tags ...
    old_product_tags.each do |product|
      unless (new_tags.try(:[], :product_tags)) &&
          (new_tags.try(:[], :product_tags).include? product.id.to_s)
        ProductsSuccess.where("success_id = ? AND product_id = ?",
                                  self.success.id, product.id)[0].destroy
      end
    end
  end

  # method returns a friendly id path that either contains or omits a product
  def csp_story_path
    url_helpers = Rails.application.routes.url_helpers
    if self.success.products.present?
      url_helpers.public_story_path(self.success.customer.slug,
                                    self.success.products.take.slug,
                                    self.slug)
    else
      url_helpers.public_story_no_product_path(self.success.customer.slug, self.slug)
    end
  end

end
