class ContributorInvitationsController < ApplicationController
  before_action { @contribution = Contribution.find(params[:contribution_id]) }

  def new
    if @contribution.invitation.blank?
      @invitation = @contribution.build_contributor_invitation.populate_template
    end
    render(:compose)
  end

  def show
    
  end

  def edit
    @invitation = @contribution.invitation
    render(:compose)
  end

  def create
    
  end

  def update
    
  end
end