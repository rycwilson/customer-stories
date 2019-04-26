class LandscapeLogo < AdwordsImage
  has_many :adwords_ads_images, foreign_key: :adwords_image_id
  has_many :adwords_ads, through: :adwords_ads_images
end