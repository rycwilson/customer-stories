class CtasController < ApplicationController

  before_action only: [:create, :update] do
    @is_primary = params[:is_primary]
  end

  # return html for cta forms
  def show
    @form = CTAForm.find( params[:id] )
    render layout: false
  end

  def create
    @company = Company.find( params[:company_id] )
    case params[:cta_type]
    when 'CTALink'
      @cta = CTALink.create(
                       description: params['new_cta']['link_description'],
                       display_text: params['new_cta']['link_display_text'],
                       link_url: params['new_cta']['link_url'],
                       company_id: @company.id,
                       company_primary: @is_primary
                     )
    when 'CTAForm'
      @cta = CTAForm.create(
                       description: params['new_cta']['form_description'],
                       display_text: params['new_cta']['form_display_text'],
                       form_html: params['new_cta']['form_html'],
                       company_id: @company.id,
                       company_primary: @is_primary
                     )
    else
      # error
    end
    respond_to { |format| format.js }
  end

  def update
    @cta = CallToAction.find( params[:id] )
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
    if @is_primary
      @cta.company.update(
        primary_cta_background_color: params['primary_cta']['background_color'],
        primary_cta_text_color: params['primary_cta']['text_color']
      )
    end
    respond_to { |format| format.js }
  end

  def destroy
    cta = CallToAction.find( params[:id] )
    cta.destroy
    respond_to do |format|
      format.json do
        render json: { id: cta.id, isPrimary: cta.company_primary? }
      end
    end
  end

end