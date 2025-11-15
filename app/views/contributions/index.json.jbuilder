# frozen_string_literal: true

json.array! @contributions do |contribution|
  json.partial!('contributions/show', contribution:)
end
