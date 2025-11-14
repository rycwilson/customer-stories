# frozen_string_literal: true

json.array! @wins do |win|
  json.partial!('successes/show', win:)
end
