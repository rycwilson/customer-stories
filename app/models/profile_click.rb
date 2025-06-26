# frozen_string_literal: true

class ProfileClick < VisitorAction
  has_one :visitor, through: :visitor_session
end
