class LogoClick < VisitorAction

  has_one :visitor, through: :visitor_session

end