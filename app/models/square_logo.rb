class SquareLogo < AdwordsImage
  has_many :adwords_ads_images, dependent: :destroy
  has_many :adwords_ads, through: :adwords_ads_images
end