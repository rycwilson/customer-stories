class CtasController < ApplicationController

  def new
    @company = Company.find(params[:company_id])
    # @cta = @company.ctas.new(type: 'CTALink')
  end

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
    @company = Company.find(params[:company_id])
    @cta = CallToAction.find(params[:id])
    if cta_params(@cta)[:primary] and @company.ctas.primary.present?
      # swap primary ctas in a single transaction to ensure there is always only one primary cta
      @company.update({
        primary_cta_background_color: cta_params(@cta)[:company_attributes][:primary_cta_background_color],
        primary_cta_text_color: cta_params(@cta)[:company_attributes][:primary_cta_text_color],
        ctas_attributes: [
          cta_params(@cta).keep_if { |k, v| k != 'company_attributes' }.merge(id: @cta.id), 
          @company.ctas.primary.take.attributes.merge('primary' => false)
        ]
      })
    else @cta.update(cta_params(@cta.id))
    end
    render(partial: 'companies/ctas', locals: { company: @company })
  end

  def destroy
    CallToAction.find(params[:id])&.destroy
    head(:ok)
  end

  private

  def cta_params(cta)
    params
      .require("cta_#{cta.id}")
      .permit(
        :description, 
        :display_text, 
        :link_url, 
        :form_html, 
        :primary, 
        company_attributes: [:primary_cta_background_color, :primary_cta_text_color]
      )
  end

end