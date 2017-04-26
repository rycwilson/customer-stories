class SponsoredStoriesImage < ActiveRecord::Base

  belongs_to :adwords_config
  belongs_to :adwords_image

end
