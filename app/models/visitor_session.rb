class VisitorSession < ActiveRecord::Base

  belongs_to :visitor
  has_many :visitor_actions, dependent: :destroy
  has_many :successes, through: :visitor_actions

  # class variable keeps track of last recorded session using clicky's session_id
  class << self
    attr_accessor :last_recorded
  end

end
