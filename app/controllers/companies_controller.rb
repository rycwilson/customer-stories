class CompaniesController < ApplicationController

  respond_to :html, :json

  # GET /company/:id.html (open Company Admin dashboard - Angular SPA)
  # GET /account.json (serve up company/account data)
  def show
    if params[:id]
      # returning user / regstered company
      @company = Company.find params[:id]

    # TODO (maybe): allow angular app to access instance variables,
    # so the current_user.company check isn't necessary,
    # i.e. no json GET request for an unregistered company (pointless)
    # http://spin.atomicobject.com/2013/11/22/pass-rails-data-angularjs/
    elsif params[:format] == 'json' && current_user.company
      # json request/response. TODO: auth token
      @company = current_user.company
    else
      # user without registered company
      # TODO: sending an empty company object seems kinda pointless
      # is there a more explicit "empty response" that's more appropriate?
      @company = Company.new
    end
    # @response = {
    #   company: @company,
    #   logo: @logo
    # }
    respond_with @company,
      include: [:customers, :successes, :stories, :industry_categories]
  end

  def create
    @company = Company.new
    @company.name = company_params[:name]
    @company.logo = decode_base64
    if @company.save
      @company.users << current_user
      # create the industry tags if any were entered
      # no validations are run on these
      if params[:industry_tags]
        params[:industry_tags].each do |tag|
          @company.industry_categories << IndustryCategory.create(name: tag)
        end
      end
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
    params.require(:company).permit(:name, :logo)
  end

  def decode_base64
    # decode base64 string
    Rails.logger.info 'decoding base64 file'
    decoded_data = Base64.decode64(params[:company][:logo][:base64])
    # create 'file' understandable by Paperclip
    data = StringIO.new(decoded_data)
    data.class_eval do
      attr_accessor :content_type, :original_filename
    end

    # set file properties
    data.content_type = params[:company][:logo][:filetype]
    data.original_filename = params[:company][:logo][:filename]

    # return data to be used as the attachment file (paperclip)
    data
  end

end
