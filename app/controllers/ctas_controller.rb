class CtasController < ApplicationController

  # return html for cta forms
  def show
    @form = CTAForm.find(params[:id])
    render layout: false
  end

  def create
    @company = Company.find(params[:company_id])
    if params[:new_cta][:make_primary].present?
      @old_primary_cta = @company.ctas.primary
      @old_primary_cta.try(:update, { primary: false })
    end
    case params[:new_cta][:type]
    when 'link'
      @cta = CTALink.create(
        description: params[:new_cta][:link_description],
        display_text: params[:new_cta][:link_display_text],
        link_url: params[:new_cta][:link_url],
        company_id: @company.id,
        primary: params[:new_cta][:make_primary].present?
      )
    when 'form'
      @cta = CTAForm.create(
        description: params[:new_cta][:form_description],
        display_text: params[:new_cta][:form_display_text],
        form_html: params[:new_cta][:form_html],
        company_id: @company.id,
        primary: params[:new_cta][:make_primary].present?
      )
    else
      # error
    end
    respond_to { |format| format.js }
  end

  def update
    @cta = CallToAction.find(params[:id])
    cta_params = params["cta_#{@cta.id}"]
    @company = @cta.company
    @make_primary = cta_params['make_primary'].present?
    @remove_primary = cta_params['remove_primary'].present?
    if @make_primary || @remove_primary
      @old_primary_cta = @cta.company.ctas.primary
      @old_primary_cta.try(:update, { primary: false })
    end
    if @cta.reload.primary?
      @cta.company.update(
        primary_cta_background_color: params['primary_cta']['background_color'],
        primary_cta_text_color: params['primary_cta']['text_color']
      )
    end
    @cta.update(
      description: cta_params['description'],
      display_text: cta_params['display_text'],
      link_url: params.dig("cta_#{@cta.id}", 'link_url'),
      form_html: params.dig("cta_#{@cta.id}", 'form_html'),
      primary: @remove_primary ? false : (@make_primary ? true : @cta.primary?)
    )
    respond_to { |format| format.js }
  end

  def destroy
    CallToAction.find(params[:id])&.destroy
    head(:ok)
  end

end