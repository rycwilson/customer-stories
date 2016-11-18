class OutboundLinksStory < ActiveRecord::Base
  belongs_to :story
  belongs_to :outbound_link
end
