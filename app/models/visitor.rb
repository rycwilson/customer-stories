class Visitor < ActiveRecord::Base

  belongs_to :company
  has_many :visitor_sessions, dependent: :destroy
  has_many :visitor_actions, through: :visitor_sessions
  has_many :page_views, through: :visitor_sessions, class_name: 'PageView'
  has_many :successes, through: :visitor_actions

  # validates :name, presence: true

  scope :company_all, ->(company_id) {
    where(company_id: company_id)
  }

end
