class ContributionEmail < ActiveRecord::Base

  belongs_to :company

  CSP = self.find_by(name: 'csp_contribution_request_template')

end
