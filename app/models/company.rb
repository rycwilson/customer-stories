class Company < ActiveRecord::Base

  validates :name, presence: true, uniqueness: true

  has_many :users, dependent: :destroy
  has_many :customers, dependent: :destroy
  has_many :successes, through: :customers
  has_many :stories, through: :successes
  has_many :industry_categories, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :product_categories, dependent: :destroy

  # paperclip
  has_attached_file :logo, styles: { medium: "300x300>", thumb: "100x100>" }, default_url: "companies/:style/missing_logo.png"
  validates_attachment_content_type :logo, content_type: /\Aimage\/.*\Z/

  # need to include the logo image with json response
  def logo_url
    logo.url(:thumb)
  end

end
