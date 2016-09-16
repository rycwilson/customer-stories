class VisitorSession < ActiveRecord::Base

  belongs_to :visitor
  has_many :visitor_actions, dependent: :destroy
  has_many :successes, through: :visitor_actions

end
