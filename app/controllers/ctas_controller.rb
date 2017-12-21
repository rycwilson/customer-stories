class CtasController < ApplicationController

  # return html for cta forms
  def show
    @form = CTAForm.find(params[:id])
    render layout: false
  end

  def create
    @company = Company.find(params[:company_id])
    if params[:cta][:is_primary]
      @prev_primary = @company.ctas.primary
      @prev_primary.try(:update, { primary: false })
    end
    case params[:cta][:type]
    when 'link'
      @cta = CTALink.create(
        description: params[:cta][:link_description],
        display_text: params[:cta][:link_display_text],
        link_url: params[:cta][:link_url],
        company_id: @company.id,
        primary: params[:cta][:is_primary]
      )
    when 'form'
      @cta = CTAForm.create(
        description: params[:cta][:form_description],
        display_text: params[:cta][:form_display_text],
        form_html: params[:cta][:form_html],
        company_id: @company.id,
        primary: params[:cta][:is_primary]
      )
    else
      # error
    end
    respond_to { |format| format.js }
  end

  def update
    @cta = CallToAction.find(params[:id])
    @is_primary = params[:is_primary]
    if params['cta']['type'] == 'CTALink'
      @cta.update(
        description: params['cta']['description'],
        display_text: params['cta']['display_text'],
        link_url: params['cta']['link_url']
      )
    elsif params['cta']['type'] == 'CTAForm'
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
    cta = CallToAction.find(params[:id])
    cta.destroy
    respond_to do |format|
      format.json do
        render json: { id: cta.id, isPrimary: cta.primary? }
      end
    end
  end

end