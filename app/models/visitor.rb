class Visitor < ActiveRecord::Base

  belongs_to :company
  has_many :visitor_sessions, dependent: :destroy
  has_many :visitor_actions, through: :visitor_sessions
  has_many :successes, through: :visitor_actions

  validates :name, presence: true, uniqueness: true

end
