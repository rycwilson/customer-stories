class GoogleAdsDescription < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :adwords_ads
end
