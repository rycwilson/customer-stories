class VisitorAction < ActiveRecord::Base

  belongs_to :success
  belongs_to :visitor_session
  has_one :visitor, through: :visitor_session
  has_one :story, through: :success

end
