class AdwordsAdGroup < ApplicationRecord

  belongs_to :adwords_campaign
  alias_method :campaign, :adwords_campaign
  has_many :adwords_ads, dependent: :destroy
  alias_method :ads, :adwords_ads

end
