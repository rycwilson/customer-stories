class AdwordsImage < ActiveRecord::Base

  belongs_to :company
  has_many :sponsored_stories_images, dependent: :destroy
  has_many :stories, through: :sponsories_images

end
