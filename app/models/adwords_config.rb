class AdwordsConfig < ActiveRecord::Base

  belongs_to :story
  has_one :sponsored_stories_image, dependent: :destroy
  has_one :adwords_image, through: :sponsored_stories_images

end
