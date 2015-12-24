
module VisitorsSeed

  def self.create
    Visitor.create(
        organization: FFaker::Company.name,
                city: FFaker::AddressUS.city,
               state: FFaker::AddressUS.state_abbr,
          created_at: (rand*60).days.ago)
  end

end