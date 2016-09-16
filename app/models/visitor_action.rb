class VisitorAction < ActiveRecord::Base

  belongs_to :success
  belongs_to :visitor_session

end
