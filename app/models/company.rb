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

end
