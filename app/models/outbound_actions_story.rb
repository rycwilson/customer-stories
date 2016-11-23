class OutboundActionsStory < ActiveRecord::Base

  belongs_to :story
  belongs_to :outbound_action

end
