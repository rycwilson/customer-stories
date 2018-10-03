class AdwordsAdGroup < ApplicationRecord

  belongs_to :adwords_campaign
  alias_attribute :campaign, :adwords_campaign
  has_many :adwords_ads, dependent: :destroy
  alias_attribute :ads, :adwords_ads

end
