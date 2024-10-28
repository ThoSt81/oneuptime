import React, { FunctionComponent, ReactElement } from "react";
import DashboardChartComponent from "Common/Types/Dashboard/DashboardComponents/DashboardChartComponent";
import { DashboardBaseComponentProps } from "./DashboardBaseComponent";

export interface ComponentProps extends DashboardBaseComponentProps {
  component: DashboardChartComponent;
}

const DashboardChartComponentElement: FunctionComponent<ComponentProps> = (
  _props: ComponentProps,
): ReactElement => {
  return <div>Chart Component</div>;
};

export default DashboardChartComponentElement;