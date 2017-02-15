class CtaClick < VisitorAction

  has_one :visitor, through: :visitor_session

end