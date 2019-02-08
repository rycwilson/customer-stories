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
    # binding.remote_pry
    puts params.to_h
    puts cta_params.to_h
    @cta = CallToAction.find(params[:id])
    if @cta.primary?
      @cta.company.update(
        primary_cta_background_color: params[:header_cta_button][:background_color],
        primary_cta_text_color: params[:header_cta_button][:text_color]
      )
    end
    @make_primary = params.dig(:cta, :make_primary).present?
    @remove_primary = params.dig(:cta, :remove_primary).present?
    if @make_primary
      params[:cta][:primary] = true
      @old_primary_cta = @cta.company.ctas.primary
      @old_primary_cta.try(:update, { primary: false })
    elsif @remove_primary
      params[:cta][:primary] = false
    else
      # don't include primary field in the update
    end
    @cta.update(cta_params)

    # if @make_primary || @remove_primary
    #   @old_primary_cta = @cta.company.ctas.primary
    #   @old_primary_cta.try(:update, { primary: false })
    # end
    # params[:cta][:primary] = (@make_primary || @cta.reload.primary) ? true : false

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

  private

  def cta_params
    params.require(:cta).permit(:description, :display_text, :link_url, :form_html, :primary)
  end

end