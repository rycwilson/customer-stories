class OutboundLink < ActiveRecord::Base

  belongs_to :company
  has_many :outbound_links_stories, dependent: :destroy
  has_many :stories, through: :outbound_links_stories

end
