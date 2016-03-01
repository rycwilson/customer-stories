class Story < ActiveRecord::Base

  belongs_to :success

  validates :title, presence: true

  def self.find_example
    Story.where(published: true).first.id
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

  def create_default_results
    self.results << Result.create(description: RESULT1)
    self.results << Result.create(description: RESULT2)
    self.results << Result.create(description: RESULT3)
  end

  def update_tags new_tags
    old_industry_tags = self.success.industry_categories
    old_product_cat_tags = self.success.product_categories
    old_product_tags = self.success.products
    # add new industry tags ...
    unless new_tags[:industry].nil?
      new_tags[:industry].each do |industry_id|
        unless old_industry_tags.any? { |industry| industry.id == industry_id.to_i }
          self.success.industry_categories << IndustryCategory.find(industry_id.to_i)
        end
      end
    end
    # remove deleted industry tags ...
    old_industry_tags.each do |industry|
      unless (new_tags[:industry]) && (new_tags[:industry].include? industry.id.to_s)
        IndustriesSuccess.where("success_id = ? AND industry_category_id = ?",
                                  self.success.id, industry.id)[0].destroy
      end
    end
    # add new product category tags ...
    unless new_tags[:product_category].nil?
      new_tags[:product_category].each do |product_cat_id|
        unless old_product_cat_tags.any? { |product_cat| product_cat.id == product_cat_id.to_i }
          self.success.product_categories << ProductCategory.find(product_cat_id.to_i)
        end
      end
    end
    # remove deleted product category tags ...
    old_product_cat_tags.each do |product_cat|
      unless (new_tags[:product_category]) &&
          (new_tags[:product_category].include? product_cat.id.to_s)
        ProductCatsSuccess.where("success_id = ? AND product_category_id = ?",
                                  self.success.id, product_cat.id)[0].destroy
      end
    end
    # add new product tags ...
    unless new_tags[:product].nil?
      new_tags[:product].each do |product_id|
        unless old_product_tags.any? { |product| product.id == product_id.to_i }
          self.success.products << Product.find(product_id.to_i)
        end
      end
    end
    # remove deleted product tags ...
    old_product_tags.each do |product|
      unless (new_tags[:product]) && (new_tags[:product].include? product.id.to_s)
        ProductsSuccess.where("success_id = ? AND product_id = ?",
                                  self.success.id, product.id)[0].destroy
      end
    end
  end

end
