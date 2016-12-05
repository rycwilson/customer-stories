class VisitorSession < ActiveRecord::Base

  belongs_to :visitor
  has_many :visitor_actions, dependent: :destroy
  has_many :successes, through: :visitor_actions

  @last_recorded = self.all.sort_by { |session| session.clicky_session_id }.last

  class << self
    attr_accessor :last_recorded
  end

end
