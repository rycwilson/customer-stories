class AdwordsCampaign < ApplicationRecord

  belongs_to :company
  has_one :adwords_ad_group, dependent: :destroy
  alias_attribute :ad_group, :adwords_ad_group
  has_many :adwords_ads, through: :adwords_ad_group
  alias_attribute :ads, :adwords_ads

end
