class Company < ActiveRecord::Base

  validates :name, presence: true, uniqueness: true
  validates :subdomain, presence: true, uniqueness: true
  validates_length_of :subdomain, maximum: 32, message: "must be 32 characters or less"
  validates_format_of :subdomain, with: /\A[a-z0-9-]*\z/, on: [:create, :update], message: "may only contain lowercase alphanumerics or hyphens"
  validates_exclusion_of :subdomain, in: ['www', 'mail', 'ftp'], message: "is not available"

  has_many :users  # no dependent: :destroy users, handle more gracefully
  has_many :invited_curators, dependent: :destroy

  has_many :customers, dependent: :destroy
  has_many :successes, through: :customers
  has_many :visitors, through: :successes
  has_many :stories, through: :successes

  has_many :industry_categories, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :product_categories, dependent: :destroy

  has_many :email_templates, dependent: :destroy

  # presently uploading direct to S3, paperclip not used
  # paperclip
  has_attached_file :logo, styles: { medium: "300x300>", thumb: "100x100>" }, default_url: "companies/:style/missing_logo.png"
  validates_attachment_content_type :logo, content_type: /\Aimage\/.*\Z/

  CSP = self.find_by(name:'CSP')

  def create_email_templates
    self.email_templates.destroy_all
    CSP.email_templates.each do |template|
      self.email_templates << template.dup
    end
  end

  def customers_select
    self.customers.map do |customer|
      # name will appear as a selection, while its id will be the value submitted
      [ customer.name, customer.id ]
    end
    .unshift( [""] )  # empty option makes placeholder possible (only needed for single select)
  end

  def product_categories_select
    self.product_categories.map do |category|
      [ category.name, category.id ]
    end
  end

  def products_select
    self.products.map do |product|
      [ product.name, product.id ]
    end
  end

  # company-specific categories (if any) listed first,
  # followed by generic categories
  def industries_select
    self.industry_categories.map do |industry|
      [ industry.name, industry.id ]
    end
      .concat(
        INDUSTRIES.map do |category|
          # value = the category itself (pass this through so a company
          # category can be created based on the generic category)
          [ category, category ]
        end
      )
      .uniq { |industry| industry[0] }  # get rid of duplicates
  end

  # TODO: this method can likely be combined with the one above
  #   only difference is this one excludes generic industries
  def industries_filter_select
    industries = self.industries_select
    # we don't want the generic industries, just the company's industries
    # (a generic industry won't have a numeric id)
    # TODO: expand this to exclude categories for which there are no stories?
    industries.keep_if { |industry| industry[1].is_a? Numeric }
    industries.unshift(['All', 'all'])
  end

  def templates_select
    self.email_templates.map do |template|
      [template.name, template.id]
    end
    .unshift( [""] )
  end

  def filter_stories type, id
    if id == 'all' # all stories for current company
      return stories = self.stories.map do |story|
        # provide the customer along with the story
        { story: story, customer: story.success.customer }
      end
    end
    case type
      when 'industries'
        stories = Success.joins(:industry_categories)
                          .where(industry_categories: { id: id })
                          .map { |success| { story: success.story,
                                          customer: success.customer } }
      else
    end
    stories
  end

  # slightly different than updating tags for a story
  def update_tags new_tags
    old_industry_tags = self.industry_categories
    old_product_cat_tags = self.product_categories
    old_product_tags = self.products
    # remove deleted industry tags ...
    old_industry_tags.each do |industry_category|
      if new_tags[:industry].nil? || !(new_tags[:industry].include? industry_category.id.to_s)
        # remove the tag from any successes
        IndustriesSuccess.where(industry_category_id: industry_category.id).destroy_all
        industry_category.destroy
      end
    end
    # add new industry tags ...
    new_tags[:industry].each do |industry_id|
      if industry_id.to_i == 0 # new (custom or default) tag
        self.industry_categories << IndustryCategory.create(name: industry_id)
      else
        # do nothing
      end
    end unless new_tags[:industry].nil?
    # remove deleted product category tags ...
    old_product_cat_tags.each do |product_category|
      if new_tags[:product_category].nil? || !(new_tags[:product_category].include? product_category.id.to_s)
        # remove the tag from any successes it appears in
        ProductCatsSuccess.where(product_category_id: product_category.id).destroy_all
        # destroy the tag
        product_category.destroy
      end
    end
    # add new product category tags ...
    new_tags[:product_category].each do |product_category_id|
      if product_category_id.to_i == 0 # new tag
        self.product_categories << ProductCategory.create(name: product_category_id)
      else
        # do nothing
      end
    end unless new_tags[:product_category].nil?
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

end
