import React from "react";
import Heading from "../../components/common/Heading";
import Button from "../../components/common/Button";
import { Plus } from "lucide-react";

const Devices = () => {
  return (
    <div>
      <Heading
        title="Device & sensor management"
        subtitle="Connected WBAN sensors and their current status."
      />

      <div className="flex justify-end">
        <Button variant="primary" size="md" iconLeft={Plus}>
          Add Device
        </Button>
      </div>
    </div>
  );
};

export default Devices;
