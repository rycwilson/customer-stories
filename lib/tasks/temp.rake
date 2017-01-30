namespace :temp do

  desc "temp stuff"

  # examine clicky data
  # can a single visitor (uid) have sessions with different:
  # - ip address, location, organization
  # => Yes
  task session_params: :environment do

    Visitor.all.each do |visitor|
      total_sessions = visitor.visitor_sessions.length
      if total_sessions > 1
        uniq_sessions = Set.new
        visitor.visitor_sessions.each do |session|
          uniq_sessions << session.ip_address
        end
        puts "#{total_sessions}, #{uniq_sessions.length}"
        # unique_ips = visitor.visitor_sessions.uniq { |session| session.values_at(:location) }.length
        # delta = total_sessions - unique_ips
        # puts delta if delta > 0
      end
    end

  end

end
