class CompaniesController < ApplicationController

  respond_to :html, :json

  # GET /company/:id.html (open Company Admin dashboard - Angular SPA)
  # GET /account.json (serve up company/account data)
  def show
    if params[:id]
      # returning user / regstered company
      @company = Company.find params[:id]

    # TODO: allow angular app to access instance variables,
    # so the current_user.company check isn't necessary,
    # i.e. no json get request for an unregistered company
    # http://spin.atomicobject.com/2013/11/22/pass-rails-data-angularjs/
    elsif params[:format] == 'json' && current_user.company
      # json request. TODO: auth token
      @company = current_user.company

    else
      # user without registered company
      # TODO: sending an empty company object seems kinda pointless
      # is there a more explicit "empty response" that's more appropriate?
      @company = Company.new
    end
    respond_with @company,
      include: [:customers, :successes, :stories, :industry_categories]
  end

  def create
    @company = Company.new company_params
    if @company.save
      # create the industry tags if any were entered
      # no validations are run on these
      if params[:industry_tags]
        params[:industry_tags].each do |tag|
          new_category = IndustryCategory.create(name: tag)
          @company.industry_categories << new_category
        end
      end
      @company.users << current_user
      # TODO: How to display flash message with json response?
      respond_with @company
    else
      render json: { error: @company.errors.messages }
    end
  end

  def update
  end

  private

  def company_params
    params.require(:company).permit(:name)
  end

end
