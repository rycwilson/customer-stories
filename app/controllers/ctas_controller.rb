class CtasController < ApplicationController

  before_action only: [:create] { @company = Company.find(params[:id]) }

  def show
    @form = CTAForm.find params[:id]
    render layout: false
  end

  def select
    cta = CallToAction.find params[:id]
    respond_to do |format|
      format.json { render json: cta }
    end
  end

  def create
    binding.remote_pry
    if params['new_cta']['link_url'].present?
      @cta = CTALink.create(
                       description: params['new_cta']['link_description'],
                       display_text: params['new_cta']['link_display_text'],
                       link_url: params['new_cta']['link_url'],
                       company_id: @company.id
                     )
    elsif params['new_cta']['form_html'].present?
      @cta = CTAForm.create(
                       description: params['new_cta']['form_description'],
                       display_text: params['new_cta']['form_display_text'],
                       form_html: params['new_cta']['form_html'],
                       company_id: @company.id
                     )
    else
      # error
    end
    respond_to { |format| format.js }
  end

  def update
    @cta = CallToAction.find(params[:id])
    if params[:link_url]
      @cta.update(
        description: params['cta']['description'],
        display_text: params['cta']['display_text'],
        link_url: params['cta']['link_url']
      )
    else
      @cta.update(
        description: params['cta']['description'],
        display_text: params['cta']['display_text'],
        form_html: params['cta']['form_html']
      )
    end
    respond_to { |format| format.js }
  end

  # method responds with the deleted action object's id
  # the id isn't needed by client, however if empty response (e.g. format.json { head :ok }),
  # then response isn't caught by the AJAX success handler
  def destroy
    action = CallToAction.find params[:id]
    action.destroy
    respond_to { |format| format.json { render json: { action: action.id } } }
  end

end