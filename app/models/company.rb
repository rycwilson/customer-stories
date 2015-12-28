class Company < ActiveRecord::Base

  validates :name, presence: true, uniqueness: true

  has_many :users  # no dependent: :destroy users, handle more gracefully

  has_many :customers, dependent: :destroy
  has_many :successes, through: :customers
  has_many :visitors, through: :successes
  has_many :stories, through: :successes

  has_many :industry_categories, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :product_categories, dependent: :destroy

  has_many :contribution_emails, dependent: :destroy

  # paperclip
  has_attached_file :logo, styles: { medium: "300x300>", thumb: "100x100>" }, default_url: "companies/:style/missing_logo.png"
  validates_attachment_content_type :logo, content_type: /\Aimage\/.*\Z/

  CSP = self.find_by(name:'CSP')

  def create_tags tags
    if tags[:industry]
      tags[:industry].each do |tag|
        self.industry_categories << IndustryCategory.create(name: tag)
      end
    end
    if tags[:product_category]
      tags[:product_category].each do |tag|
        self.product_categories << ProductCategory.create(name: tag)
      end
    end
    if tags[:product]
      tags[:product].each do |tag|
        self.products << Product.create(name: tag)
      end
    end
  end

  def create_email_templates
    CSP.contribution_emails.each do |template|
      self.contribution_emails << template.dup
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


end
