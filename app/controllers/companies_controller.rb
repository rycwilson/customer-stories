class CompaniesController < ApplicationController

  respond_to :html, :json

  def new
  end

  # GET /account.html (open Company Admin dashboard - Angular SPA)
  # GET /account.json (serve up company data)
  def show
    @company = current_user.company
    respond_with @company, include: [:customers, :successes, :stories]
  end

  def create
  end

  def update
  end

end
