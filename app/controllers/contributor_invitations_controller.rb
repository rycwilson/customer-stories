class ContributorInvitationsController < ApplicationController
  before_action { @contribution = Contribution.find(params[:contribution_id]) }

  def new
    if @contribution.invitation.blank?
      @invitation = @contribution.build_contributor_invitation.populate_template
      render(:compose)
    end
  end

  def show
    
  end

  def edit
    render(:compose, { invitation: @contribution.invitation })
  end

  def create
    
  end

  def update
    
  end
end