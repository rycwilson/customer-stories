# frozen_string_literal: true

class VisitorAction < ApplicationRecord
  # default_scope { order(:timestamp) }

  belongs_to :company
  belongs_to :success, optional: true
  belongs_to :visitor_session
  has_one :visitor, through: :visitor_session
  has_one :story, through: :success
end
