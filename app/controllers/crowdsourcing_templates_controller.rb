
class CrowdsourcingTemplatesController < ApplicationController

  def show
  end

  def edit
    @company = Company.find(params[:company_id])
    @template = CrowdsourcingTemplate.find(params[:id])
    render({
      partial: 'companies/settings/crowdsourcing_template_form',
      locals: { company: @company, template: @template }
    })
  end

  def create
  end

  def update
  end

  def destroy
  end

end
