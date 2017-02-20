class StoryShare < VisitorAction

  has_one :visitor, through: :visitor_session

end