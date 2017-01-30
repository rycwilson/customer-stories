class OutboundAction < ActiveRecord::Base

  belongs_to :company
  has_many :outbound_actions_stories, dependent: :destroy
  has_many :stories, through: :outbound_actions_stories

end