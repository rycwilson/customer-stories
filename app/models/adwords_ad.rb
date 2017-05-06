class AdwordsAd < ActiveRecord::Base

  belongs_to :adwords_ad_group
  alias_attribute :ad_group, :adwords_ad_group
  belongs_to :story
  has_one :adwords_ads_image
  has_one :adwords_image, through: :adwords_ads_image

end
