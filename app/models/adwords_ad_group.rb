class AdwordsAdGroup < ApplicationRecord
  belongs_to :adwords_campaign
  alias campaign adwords_campaign
  has_many :adwords_ads, dependent: :destroy
  alias ads adwords_ads
end
